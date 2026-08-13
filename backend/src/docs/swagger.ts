import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Employee Tracking & Project Reporting API',
      version: '1.0.0',
      description: 'Starter backend API documentation for the employee tracking platform',
    },
    servers: [{ url: '/api/v1' }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
