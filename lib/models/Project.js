import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const ProjectSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  workspace_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

ProjectSchema.index({ workspace_id: 1 })
ProjectSchema.index({ id: 1 })

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema)