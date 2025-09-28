import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

/**
 *
 */
@Injectable()
export class InteractionCheckerService {
  private readonly logger = new Logger(InteractionCheckerService.name);

  /**
   *
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Check for drug interactions among a list of medications
   */
  async checkInteractions(medications: any[]): Promise<any[]> {
    try {
      const interactions = [];

      // Check each pair of medications
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const drug1 = medications[i];
          const drug2 = medications[j];

          // Check for known interactions in database
          const knownInteraction = await this.prisma.drugInteraction.findFirst({
            where: {
              OR: [
                { drug1Id: drug1.id, drug2Id: drug2.id },
                { drug1Id: drug2.id, drug2Id: drug1.id },
              ],
            },
          });

          if (knownInteraction) {
            interactions.push({
              id: knownInteraction.id,
              drug1: {
                id: drug1.id,
                name: drug1.name,
                genericName: drug1.genericName,
              },
              drug2: {
                id: drug2.id,
                name: drug2.name,
                genericName: drug2.genericName,
              },
              interactionType: knownInteraction.interactionType,
              severity: knownInteraction.severity,
              description: knownInteraction.description,
              clinicalEffects: knownInteraction.clinicalEffects,
              management: knownInteraction.management,
              source: knownInteraction.source,
              lastUpdated: knownInteraction.lastUpdated,
            });
          } else {
            // Check for potential interactions based on drug classes or properties
            const potentialInteraction = await this.checkPotentialInteractions(drug1, drug2);
            if (potentialInteraction) {
              interactions.push(potentialInteraction);
            }
          }
        }
      }

      // Sort interactions by severity
      return interactions.sort(
        (a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity),
      );
    } catch (error) {
      this.logger.error(`Failed to check interactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check for potential interactions based on drug properties
   */
  private async checkPotentialInteractions(drug1: any, drug2: any): Promise<any | null> {
    // This is a simplified implementation
    // In a real system, you would have more sophisticated rules

    const interactions = [];

    // Check for common interaction patterns
    if (this.isAnticoagulant(drug1) && this.isNSAID(drug2)) {
      interactions.push({
        drug1: { id: drug1.id, name: drug1.name },
        drug2: { id: drug2.id, name: drug2.name },
        interactionType: 'MAJOR',
        severity: 'MODERATE',
        description: 'Anticoagulant and NSAID combination may increase bleeding risk',
        clinicalEffects: 'Increased risk of gastrointestinal bleeding',
        management: 'Monitor for signs of bleeding, consider alternative pain management',
        source: 'RULE_BASED',
      });
    }

    if (this.isAnticoagulant(drug2) && this.isNSAID(drug1)) {
      interactions.push({
        drug1: { id: drug1.id, name: drug1.name },
        drug2: { id: drug2.id, name: drug2.name },
        interactionType: 'MAJOR',
        severity: 'MODERATE',
        description: 'NSAID and anticoagulant combination may increase bleeding risk',
        clinicalEffects: 'Increased risk of gastrointestinal bleeding',
        management: 'Monitor for signs of bleeding, consider alternative pain management',
        source: 'RULE_BASED',
      });
    }

    // Check for duplicate therapies
    if (this.areDuplicateTherapies(drug1, drug2)) {
      interactions.push({
        drug1: { id: drug1.id, name: drug1.name },
        drug2: { id: drug2.id, name: drug2.name },
        interactionType: 'MODERATE',
        severity: 'MILD',
        description: 'Potential duplicate therapy - both medications may have similar effects',
        clinicalEffects: 'Possible increased side effects without additional benefit',
        management: 'Review indication for both medications, consider discontinuation of one',
        source: 'RULE_BASED',
      });
    }

    // Check for CYP450 interactions (simplified)
    const cypInteraction = this.checkCYP450Interactions(drug1, drug2);
    if (cypInteraction) {
      interactions.push(cypInteraction);
    }

    return interactions.length > 0 ? interactions[0] : null;
  }

  /**
   * Check if medication is an anticoagulant
   */
  private isAnticoagulant(drug: any): boolean {
    const anticoagulants = [
      'warfarin',
      'heparin',
      'enoxaparin',
      'rivaroxaban',
      'apixaban',
      'dabigatran',
      'edoxaban',
      'fondaparinux',
    ];

    return anticoagulants.some(
      anticoag =>
        drug.name.toLowerCase().includes(anticoag) ||
        drug.genericName?.toLowerCase().includes(anticoag),
    );
  }

  /**
   * Check if medication is an NSAID
   */
  private isNSAID(drug: any): boolean {
    const nsaids = [
      'aspirin',
      'ibuprofen',
      'naproxen',
      'diclofenac',
      'celecoxib',
      'meloxicam',
      'indomethacin',
      'ketorolac',
      'piroxicam',
    ];

    return nsaids.some(
      nsaid =>
        drug.name.toLowerCase().includes(nsaid) || drug.genericName?.toLowerCase().includes(nsaid),
    );
  }

  /**
   * Check if two medications are duplicate therapies
   */
  private areDuplicateTherapies(drug1: any, drug2: any): boolean {
    // Simplified duplicate therapy detection
    // In a real system, this would be more sophisticated

    const duplicatePairs = [
      ['lisinopril', 'enalapril'], // ACE inhibitors
      ['atorvastatin', 'simvastatin'], // Statins
      ['metformin', 'glipizide'], // Diabetes medications
      ['omeprazole', 'pantoprazole'], // PPIs
    ];

    const drug1Name = drug1.name.toLowerCase();
    const drug2Name = drug2.name.toLowerCase();

    return duplicatePairs.some(pair => pair.includes(drug1Name) && pair.includes(drug2Name));
  }

  /**
   * Check for CYP450 enzyme interactions
   */
  private checkCYP450Interactions(drug1: any, drug2: any): any | null {
    // Simplified CYP450 interaction checking
    // In a real system, this would reference a comprehensive database

    const cypInducers = ['rifampin', 'carbamazepine', 'phenobarbital', 'phénytoïne'];
    const cypInhibitors = ['ketoconazole', 'itraconazole', 'clarithromycin', 'fluconazole'];
    const cypSubstrates = ['warfarin', 'theophylline', 'cyclosporine', 'tacrolimus'];

    const drug1Name = drug1.name.toLowerCase();
    const drug2Name = drug2.name.toLowerCase();

    const drug1IsInducer = cypInducers.some(d => drug1Name.includes(d));
    const drug1IsInhibitor = cypInhibitors.some(d => drug1Name.includes(d));
    const drug1IsSubstrate = cypSubstrates.some(d => drug1Name.includes(d));

    const drug2IsInducer = cypInducers.some(d => drug2Name.includes(d));
    const drug2IsInhibitor = cypInhibitors.some(d => drug2Name.includes(d));
    const drug2IsSubstrate = cypSubstrates.some(d => drug2Name.includes(d));

    if ((drug1IsInducer && drug2IsSubstrate) || (drug2IsInducer && drug1IsSubstrate)) {
      return {
        drug1: { id: drug1.id, name: drug1.name },
        drug2: { id: drug2.id, name: drug2.name },
        interactionType: 'MODERATE',
        severity: 'MODERATE',
        description: 'CYP450 enzyme inducer may decrease levels of substrate drug',
        clinicalEffects: 'Reduced effectiveness of substrate medication',
        management: 'Monitor therapeutic levels, consider dose adjustment',
        source: 'CYP450_RULE',
      };
    }

    if ((drug1IsInhibitor && drug2IsSubstrate) || (drug2IsInhibitor && drug1IsSubstrate)) {
      return {
        drug1: { id: drug1.id, name: drug1.name },
        drug2: { id: drug2.id, name: drug2.name },
        interactionType: 'MODERATE',
        severity: 'MODERATE',
        description: 'CYP450 enzyme inhibitor may increase levels of substrate drug',
        clinicalEffects: 'Increased risk of toxicity from substrate medication',
        management: 'Monitor for toxicity, consider dose reduction',
        source: 'CYP450_RULE',
      };
    }

    return null;
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: string): number {
    const weights = {
      CONTRAINDICATED: 5,
      SEVERE: 4,
      MODERATE: 3,
      MILD: 2,
      UNKNOWN: 1,
    };
    return weights[severity] || 0;
  }

  /**
   * Check interactions for a specific patient considering their medical history
   */
  async checkInteractionsForPatient(medications: any[], patientId: string): Promise<any[]> {
    try {
      // Get patient information
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          allergies: true,
          medicalHistory: true,
          currentMedications: true,
        },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get base interactions
      const interactions = await this.checkInteractions(medications);

      // Add patient-specific considerations
      const patientSpecificInteractions = await this.checkPatientSpecificInteractions(
        medications,
        patient,
      );

      return [...interactions, ...patientSpecificInteractions];
    } catch (error) {
      this.logger.error(
        `Failed to check patient-specific interactions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check patient-specific interactions (allergies, conditions, etc.)
   */
  private async checkPatientSpecificInteractions(medications: any[], patient: any): Promise<any[]> {
    const interactions = [];

    // Check allergies
    if (patient.allergies && patient.allergies.length > 0) {
      for (const medication of medications) {
        for (const allergy of patient.allergies) {
          if (this.isAllergicReaction(medication, allergy)) {
            interactions.push({
              drug1: { id: medication.id, name: medication.name },
              drug2: null, // Patient allergy, not drug-drug interaction
              interactionType: 'ALLERGY',
              severity: 'CONTRAINDICATED',
              description: `Patient allergic to ${allergy} - potential cross-reactivity with ${medication.name}`,
              clinicalEffects: 'Allergic reaction',
              management: 'Do not prescribe - use alternative medication',
              source: 'PATIENT_ALLERGY',
            });
          }
        }
      }
    }

    // Check medical history for contraindications
    if (patient.medicalHistory) {
      // This would check for conditions that contraindicate certain medications
      // Implementation depends on how medical history is structured
    }

    return interactions;
  }

  /**
   * Check if medication causes allergic reaction
   */
  private isAllergicReaction(medication: any, allergy: string): boolean {
    // Simplified allergy checking
    // In a real system, this would be more sophisticated

    const medName = medication.name.toLowerCase();
    const allergyLower = allergy.toLowerCase();

    // Check for exact matches
    if (medName.includes(allergyLower) || allergyLower.includes(medName)) {
      return true;
    }

    // Check for common cross-reactivities
    const penicillinAllergies = ['penicillin', 'amoxicillin', 'ampicillin'];
    if (
      penicillinAllergies.some(p => allergyLower.includes(p)) &&
      penicillinAllergies.some(p => medName.includes(p))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get interaction summary for reporting
   */
  getInteractionSummary(interactions: any[]): any {
    const summary = {
      total: interactions.length,
      bySeverity: {
        contraindicated: 0,
        severe: 0,
        moderate: 0,
        mild: 0,
        unknown: 0,
      },
      byType: {
        allergy: 0,
        major: 0,
        moderate: 0,
        minor: 0,
      },
      criticalAlerts: [],
      warnings: [],
    };

    for (const interaction of interactions) {
      // Count by severity
      switch (interaction.severity) {
        case 'CONTRAINDICATED':
          summary.bySeverity.contraindicated++;
          summary.criticalAlerts.push(interaction.description);
          break;
        case 'SEVERE':
          summary.bySeverity.severe++;
          summary.criticalAlerts.push(interaction.description);
          break;
        case 'MODERATE':
          summary.bySeverity.moderate++;
          summary.warnings.push(interaction.description);
          break;
        case 'MILD':
          summary.bySeverity.mild++;
          break;
        default:
          summary.bySeverity.unknown++;
      }

      // Count by type
      switch (interaction.interactionType) {
        case 'ALLERGY':
          summary.byType.allergy++;
          break;
        case 'MAJOR':
          summary.byType.major++;
          break;
        case 'MODERATE':
          summary.byType.moderate++;
          break;
        case 'MINOR':
          summary.byType.minor++;
          break;
      }
    }

    return summary;
  }
}
