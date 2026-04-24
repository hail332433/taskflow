import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const WorkspaceSchema = new mongoose.Schema({
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
  owner_id: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['FREE', 'PRO', 'ENTERPRISE'],
    default: 'FREE'
  },
  members: [{
    user_id: String,
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

WorkspaceSchema.index({ owner_id: 1 })
WorkspaceSchema.index({ id: 1 })
WorkspaceSchema.index({ 'members.user_id': 1 })

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema)