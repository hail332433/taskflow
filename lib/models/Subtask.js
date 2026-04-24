import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const SubtaskSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  task_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

SubtaskSchema.index({ task_id: 1 })
SubtaskSchema.index({ id: 1 })

export default mongoose.models.Subtask || mongoose.model('Subtask', SubtaskSchema)