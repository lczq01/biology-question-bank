import express from 'express';
import {
  createKnowledgePoint,
  getKnowledgePoints,
  getKnowledgePointById,
  updateKnowledgePoint,
  deleteKnowledgePoint,
  getKnowledgeTree,
  addRelatedPoint,
  removeRelatedPoint,
  getKnowledgePointStats,
  getKnowledgePointByCustomId,
  generateNextCustomId,
  getModuleInfo,
  validateCustomIdEndpoint,
  batchCheckIdConflicts,
  getIdSuggestions
} from '../controllers/knowledgePointController';
import { mockAuth } from '../middleware/mockAuth';

const router = express.Router();

// 公共路由（不需要认证）
router.get('/stats', getKnowledgePointStats);
router.get('/tree', getKnowledgeTree);
router.get('/modules', getModuleInfo);
router.get('/generate-id', generateNextCustomId);
router.get('/id-suggestions', getIdSuggestions);
router.get('/custom/:customId', getKnowledgePointByCustomId);
router.get('/', getKnowledgePoints);
router.get('/:id', getKnowledgePointById);

// 需要认证的路由
router.post('/validate-id', mockAuth, validateCustomIdEndpoint);
router.post('/batch-check-conflicts', mockAuth, batchCheckIdConflicts);
router.post('/', mockAuth, createKnowledgePoint);
router.put('/:id', mockAuth, updateKnowledgePoint);
router.delete('/:id', mockAuth, deleteKnowledgePoint);
router.post('/:id/related', mockAuth, addRelatedPoint);
router.delete('/:id/related', mockAuth, removeRelatedPoint);

export default router;