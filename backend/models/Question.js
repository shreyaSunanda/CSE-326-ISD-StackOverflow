const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    minlength: [15, 'Title must be at least 15 characters'],
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  body: { 
    type: String, 
    required: [true, 'Question body is required'],
    minlength: [30, 'Question body must be at least 30 characters']
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v && v.length >= 1 && v.length <= 5;
      },
      message: 'You must provide between 1 and 5 tags.'
    }
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, 'Author ID is required']
  },
  authorName: { 
    type: String, 
    required: [true, 'Author name is required']
  },
  source: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual'
  }
}, {
  timestamps: true 
});


QuestionSchema.pre('save', async function() {
  // tag check
  if (!this.tags || !Array.isArray(this.tags) || this.tags.length === 0) {
    throw new Error('At least 1 tag is required');
  }

  if (this.tags.length > 5) {
    throw new Error('Maximum 5 tags allowed');
  }

  const cleanTags = this.tags.map(t => String(t).toLowerCase().trim());
  this.tags = [...new Set(cleanTags)];
});


QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ tags: 1 });

module.exports = mongoose.model("Question", QuestionSchema);