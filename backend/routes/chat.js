const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', chatController.getMyChats);
router.post('/', chatController.getOrCreateChat);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.put('/:chatId/read', chatController.markAsRead);

module.exports = router;
