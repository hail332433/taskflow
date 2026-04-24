import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const TaskSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  column_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  due_date: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  assigned_to: {
    type: String,
    default: null
  },
  created_by: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  archived: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

TaskSchema.index({ column_id: 1, order: 1 })
TaskSchema.index({ id: 1 })
TaskSchema.index({ assigned_to: 1 })
TaskSchema.index({ due_date: 1 })
TaskSchema.index({ priority: 1 })

export default mongoose.models.Task || mongoose.model('Task', TaskSchema)