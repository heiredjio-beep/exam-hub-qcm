/**
 * Erreur applicative portant son code HTTP.
 *
 * RG-13 : toute erreur de l'API sort au format { "message": "..." } avec
 * le bon code HTTP. Les couches Service/ et Controller/ ne construisent
 * jamais de reponse d'erreur elles-memes : elles levent une HttpError et
 * le middleware errorHandler s'occupe du reste.
 *
 *   throw new HttpError(409, "Vous avez deja passe cet examen.");
 */
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
    Error.captureStackTrace?.(this, HttpError);
  }

  /** 400 - donnees invalides (question a 7 choix, email malforme, points negatifs). */
  static badRequest(message: string): HttpError {
    return new HttpError(400, message);
  }

  /** 401 - non authentifie (token absent, expire ou invalide). */
  static unauthorized(message = 'Authentification requise.'): HttpError {
    return new HttpError(401, message);
  }

  /** 403 - authentifie mais pas autorise (etudiant appelant une route admin). */
  static forbidden(message = 'Acces refuse.'): HttpError {
    return new HttpError(403, message);
  }

  /** 404 - introuvable (examen inexistant, question supprimee). */
  static notFound(message = 'Ressource introuvable.'): HttpError {
    return new HttpError(404, message);
  }

  /** 409 - conflit (deuxieme tentative RG-02, code de cours deja pris, RG-09). */
  static conflict(message: string): HttpError {
    return new HttpError(409, message);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
