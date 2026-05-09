import { Request, Response } from 'express';
import pool from '../config/db';
import { haversineDistance } from '../utils/distance';
import { SanitisedSchool, UserCoords } from '../middlewares/validate';

export async function addSchool(req: Request, res: Response): Promise<void> {
  const { name, address, latitude, longitude } = (res as any).locals.sanitised as SanitisedSchool;

  try {
    const [result]: any = await pool.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );

    res.status(201).json({
      success: true,
      message: 'School added successfully.',
      data: { id: result.insertId, name, address, latitude, longitude },
    });
  } catch (err: any) {
    console.error('addSchool error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

export async function listSchools(req: Request, res: Response): Promise<void> {
  const { latitude: userLat, longitude: userLon } = (res as any).locals.userCoords as UserCoords;

  try {
    const [schools]: any = await pool.execute('SELECT * FROM schools');

    const schoolsWithDistance = schools.map((school: any) => ({
      ...school,
      distance_km: parseFloat(
        haversineDistance(userLat, userLon, school.latitude, school.longitude).toFixed(2)
      ),
    }));

    schoolsWithDistance.sort((a: any, b: any) => a.distance_km - b.distance_km);

    res.status(200).json({
      success: true,
      count: schoolsWithDistance.length,
      data: schoolsWithDistance,
    });
  } catch (err: any) {
    console.error('listSchools error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}