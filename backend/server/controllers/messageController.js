import Message from "../models/Message.js";

/* ==============================
   MARK MESSAGE AS READ
==============================*/
export const markMessageRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
