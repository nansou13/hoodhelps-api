export interface CustomError extends Error {
    status: number;  // Ajoutez '?' pour rendre 'status' optionnel si toutes les erreurs n'ont pas un 'status'
  }