import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // below normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 }, // normal load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 }, // around the breaking point
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 }, // beyond the breaking point
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 }, // scale down. Recovery stage.
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/patients`],
    ['GET', `${BASE_URL}/api/appointments`],
    ['GET', `${BASE_URL}/api/laboratory/tests`],
    ['GET', `${BASE_URL}/api/radiology/exams`],
    ['GET', `${BASE_URL}/api/pharmacy/medicines`],
  ]);

  responses.forEach((res, index) => {
    check(res, {
      [`status is 200 for endpoint ${index}`]: (r) => r.status === 200,
      [`response time < 500ms for endpoint ${index}`]: (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}