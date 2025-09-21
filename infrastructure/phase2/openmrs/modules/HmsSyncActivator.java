package org.openmrs.module.hmssync;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.Encounter;
import org.openmrs.Obs;
import org.openmrs.api.context.Context;
import org.openmrs.module.Activator;
import org.openmrs.module.ModuleActivator;
import org.openmrs.event.Event;
import org.openmrs.event.EventListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

/**
 * HMS Data Synchronization Module Activator
 * Listens for OpenMRS events and publishes them to RabbitMQ
 */
public class HmsSyncActivator implements ModuleActivator {

    private static final Log log = LogFactory.getLog(HmsSyncActivator.class);
    private RabbitTemplate rabbitTemplate;
    private ObjectMapper objectMapper;
    private EventListener patientListener;
    private EventListener encounterListener;

    @Override
    public void startup() {
        log.info("Starting HMS Data Synchronization Module");

        try {
            // Initialize RabbitMQ connection
            initializeRabbitMQ();

            // Initialize JSON mapper
            objectMapper = new ObjectMapper();

            // Register event listeners
            registerEventListeners();

            log.info("HMS Data Synchronization Module started successfully");

        } catch (Exception e) {
            log.error("Failed to start HMS Data Synchronization Module", e);
        }
    }

    @Override
    public void shutdown() {
        log.info("Shutting down HMS Data Synchronization Module");

        try {
            // Unregister event listeners
            if (patientListener != null) {
                Event.unsubscribe(Patient.class, patientListener);
            }
            if (encounterListener != null) {
                Event.unsubscribe(Encounter.class, encounterListener);
            }

            log.info("HMS Data Synchronization Module shut down successfully");

        } catch (Exception e) {
            log.error("Error shutting down HMS Data Synchronization Module", e);
        }
    }

    private void initializeRabbitMQ() {
        String host = Context.getAdministrationService().getGlobalProperty("hms.sync.rabbitmq.host");
        String port = Context.getAdministrationService().getGlobalProperty("hms.sync.rabbitmq.port");
        String username = Context.getAdministrationService().getGlobalProperty("hms.sync.rabbitmq.username");
        String password = Context.getAdministrationService().getGlobalProperty("hms.sync.rabbitmq.password");

        CachingConnectionFactory connectionFactory = new CachingConnectionFactory();
        connectionFactory.setHost(host);
        connectionFactory.setPort(Integer.parseInt(port));
        connectionFactory.setUsername(username);
        connectionFactory.setPassword(password);

        rabbitTemplate = new RabbitTemplate(connectionFactory);
        log.info("RabbitMQ connection initialized");
    }

    private void registerEventListeners() {
        // Patient events
        patientListener = new EventListener() {
            @Override
            public void onEvent(Event event) {
                handlePatientEvent(event);
            }
        };
        Event.subscribe(Patient.class, patientListener);

        // Encounter events
        encounterListener = new EventListener() {
            @Override
            public void onEvent(Event event) {
                handleEncounterEvent(event);
            }
        };
        Event.subscribe(Encounter.class, encounterListener);

        log.info("Event listeners registered");
    }

    private void handlePatientEvent(Event event) {
        try {
            Patient patient = (Patient) event.getSource();
            String action = getEventAction(event);

            Map<String, Object> message = new HashMap<>();
            message.put("id", patient.getUuid());
            message.put("patientUuid", patient.getUuid());
            message.put("action", action);
            message.put("timestamp", new java.util.Date().toString());
            message.put("source", "openmrs");

            // Add patient details
            if (patient.getPersonName() != null) {
                message.put("givenName", patient.getPersonName().getGivenName());
                message.put("familyName", patient.getPersonName().getFamilyName());
            }
            if (patient.getGender() != null) {
                message.put("gender", patient.getGender());
            }
            if (patient.getBirthdate() != null) {
                message.put("birthdate", patient.getBirthdate().toString());
            }

            String routingKey = "patient." + action;
            rabbitTemplate.convertAndSend("sync.patient", routingKey, objectMapper.writeValueAsString(message));

            log.info("Published patient event: " + routingKey + " for patient " + patient.getUuid());

        } catch (Exception e) {
            log.error("Error handling patient event", e);
        }
    }

    private void handleEncounterEvent(Event event) {
        try {
            Encounter encounter = (Encounter) event.getSource();
            String action = getEventAction(event);

            Map<String, Object> message = new HashMap<>();
            message.put("id", encounter.getUuid());
            message.put("encounterUuid", encounter.getUuid());
            message.put("patientUuid", encounter.getPatient().getUuid());
            message.put("action", action);
            message.put("timestamp", new java.util.Date().toString());
            message.put("source", "openmrs");

            // Add encounter details
            if (encounter.getEncounterType() != null) {
                message.put("encounterType", encounter.getEncounterType().getName());
            }
            if (encounter.getEncounterDatetime() != null) {
                message.put("encounterDatetime", encounter.getEncounterDatetime().toString());
            }
            if (encounter.getLocation() != null) {
                message.put("location", encounter.getLocation().getName());
            }

            String routingKey = "encounter." + action;
            rabbitTemplate.convertAndSend("sync.encounter", routingKey, objectMapper.writeValueAsString(message));

            log.info("Published encounter event: " + routingKey + " for encounter " + encounter.getUuid());

        } catch (Exception e) {
            log.error("Error handling encounter event", e);
        }
    }

    private String getEventAction(Event event) {
        String eventType = event.getEventType();
        if (eventType.contains("CREATE")) {
            return "created";
        } else if (eventType.contains("UPDATE")) {
            return "updated";
        } else if (eventType.contains("DELETE")) {
            return "deleted";
        }
        return "modified";
    }
}