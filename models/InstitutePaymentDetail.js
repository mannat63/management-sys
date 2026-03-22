import mongoose from "mongoose";

const InstitutePaymentDetailSchema = new mongoose.Schema(
  {
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
    bank_name: { type: String },
    account_number: { type: String },
    ifsc_code: { type: String },
    upi_id: { type: String },
    qr_image_url: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.InstitutePaymentDetail || mongoose.model("InstitutePaymentDetail", InstitutePaymentDetailSchema);
