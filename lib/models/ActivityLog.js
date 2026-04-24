import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const ActivityLogSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  entity: {
    type: String,
    required: true
  },
  entity_id: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  workspace_id: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

ActivityLogSchema.index({ workspace_id: 1, created_at: -1 })
ActivityLogSchema.index({ entity: 1, entity_id: 1 })
ActivityLogSchema.index({ id: 1 })

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema)