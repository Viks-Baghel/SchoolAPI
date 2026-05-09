import { Router } from 'express';
import { addSchool, listSchools } from '../controllers/schoolController';
import { validateAddSchool, validateListSchools } from '../middlewares/validate';

const router = Router();
router.post('/addSchool', validateAddSchool, addSchool);

router.get('/listSchools', validateListSchools, listSchools);

export default router;