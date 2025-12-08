declare const process: any;

export const environment = {
  production: false,
  apiUrl: (typeof window !== 'undefined' &&
    (window as any).__API_URL__) ||
    (typeof process !== 'undefined' && process.env && process.env['API_URL']) ||
    'http://localhost:3000',
};
