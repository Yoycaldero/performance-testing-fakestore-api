import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';

// Cargamos los IDs desde el JSON externo
const data = new SharedArray('product ids', function () {
    return JSON.parse(open('./data.json'));
});

export const options = {
    stages: [
        { duration: '100s', target: 100 }, // Ramp-up: 1 usuario x segundo hasta 100
        { duration: '25m', target: 100 },  // Meseta: Mantener 100 usuarios por 25 min
        { duration: '100s', target: 0 },   // Ramp-down: Bajar de 1 en 1 hasta 0
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // El error debe ser menor al 1%
        http_req_duration: ['p(95)<2000'], // El 95% de las peticiones deben bajar de 2s
    },
};

export default function () {
    // 1. Startup delay: sleep aleatorio entre 4 y 8 segundos
    const waitTime = Math.floor(Math.random() * (8 - 4 + 1)) + 4;
    sleep(waitTime);

    // 2. Selección dinámica del ID
    const product = data[Math.floor(Math.random() * data.length)];
    const url = `https://fakestoreapi.com/products/${product.id}`;

    // 3. Ejecución de la petición
    const res = http.get(url);

    // 4. Validaciones (Checks)
    check(res, {
        'status es 200': (r) => r.status === 200,
        'contenido correcto': (r) => r.body.includes('id'),
    });
}