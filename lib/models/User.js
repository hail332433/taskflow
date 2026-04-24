import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    default: 'MEMBER'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

UserSchema.index({ email: 1 })
UserSchema.index({ id: 1 })

export default mongoose.models.User || mongoose.model('User', UserSchema)