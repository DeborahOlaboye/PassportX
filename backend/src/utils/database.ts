import mongoose from 'mongoose'

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/passportx'
    
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    console.log('✅ MongoDB disconnected')
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error)
  }
}