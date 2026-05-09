import { Request, Response, NextFunction } from 'express';

export interface SanitisedSchool {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserCoords {
  latitude: number;
  longitude: number;
}

export function validateAddSchool(req: Request, res: Response, next: NextFunction): void {
  const { name, address, latitude, longitude } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string.');
  }
  if (!address || typeof address !== 'string' || address.trim() === '') {
    errors.push('address is required and must be a non-empty string.');
  }

  const lat = parseFloat(latitude);
  if (latitude === undefined || latitude === '') {
    errors.push('latitude is required.');
  } else if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('latitude must be a valid number between -90 and 90.');
  }

  const lon = parseFloat(longitude);
  if (longitude === undefined || longitude === '') {
    errors.push('longitude is required.');
  } else if (isNaN(lon) || lon < -180 || lon > 180) {
    errors.push('longitude must be a valid number between -180 and 180.');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  (res as any).locals.sanitised = {
    name: name.trim(),
    address: address.trim(),
    latitude: lat,
    longitude: lon,
  } as SanitisedSchool;

  next();
}

export function validateListSchools(req: Request, res: Response, next: NextFunction): void {
  const { latitude, longitude } = req.query;
  const errors: string[] = [];

  const lat = parseFloat(latitude as string);
  if (!latitude) {
    errors.push('latitude query parameter is required.');
  } else if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('latitude must be a valid number between -90 and 90.');
  }

  const lon = parseFloat(longitude as string);
  if (!longitude) {
    errors.push('longitude query parameter is required.');
  } else if (isNaN(lon) || lon < -180 || lon > 180) {
    errors.push('longitude must be a valid number between -180 and 180.');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  (res as any).locals.userCoords = { latitude: lat, longitude: lon } as UserCoords;

  next();
}