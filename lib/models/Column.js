import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const ColumnSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  board_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  type: {
    type: String,
    enum: ['TODO', 'DOING', 'DONE'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

ColumnSchema.index({ board_id: 1, order: 1 })
ColumnSchema.index({ id: 1 })

export default mongoose.models.Column || mongoose.model('Column', ColumnSchema)