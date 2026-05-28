import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.models.School || mongoose.model('School', schoolSchema);
