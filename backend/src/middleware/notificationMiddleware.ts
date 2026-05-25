// Middleware for validating notification input
// This requires express to be installed

import { Request, Response, NextFunction } from 'express';

export function validateNotificationInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { type, title, message, channels } = req.body;

  if (!type || typeof type !== 'string') {
    res.status(400).json({ error: 'Invalid notification type' });
    return;
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    res.status(400).json({ error: 'At least one channel is required' });
    return;
  }

  const validChannels = ['in_app', 'email', 'websocket'];
  const invalidChannels = channels.filter(
    (channel: string) => !validChannels.includes(channel)
  );

  if (invalidChannels.length > 0) {
    res
      .status(400)
      .json({ error: `Invalid channels: ${invalidChannels.join(', ')}` });
    return;
  }

  next();
}
