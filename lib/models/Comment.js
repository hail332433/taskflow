import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const CommentSchema = new mongoose.Schema({
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
  user_id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

CommentSchema.index({ task_id: 1, created_at: -1 })
CommentSchema.index({ id: 1 })

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema)