import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const BoardSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  project_id: {
    type: String,
    required: true
  },
  name: {
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

BoardSchema.index({ project_id: 1 })
BoardSchema.index({ id: 1 })

export default mongoose.models.Board || mongoose.model('Board', BoardSchema)