const express = require("express");
const Poll = require("../models/Poll");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all polls
router.get("/", auth, async (req, res) => {
  try {
    const polls = await Poll.find().populate("creator", "email");
    res.json({ polls });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/find",auth,async (res,req)=>{
  try{
    const search=await Poll.find(questions.contains("manage"))
        res.json({search});
    
  }
  catch(err){
    res.status(500).json({msg:"Server error"})
  }
})
// Create poll
router.post("/", auth, async (req, res) => {
  const { question, options } = req.body;
  if (!question || !options || options.length < 2 || options.length > 4) {
    return res.status(400).json({ msg: "Poll must have a question and 2–4 options" });
  }

  try {
    const poll = new Poll({
      question,
      options: options.map(text => ({ text })),
      creator: req.user.id,
    });
    await poll.save();
    res.json({ poll });
  } catch (err) {
    res.status(400).json({ msg: "Validation error", error: err.message });
  }
});

// Vote on a poll
router.put("/:id/vote", auth, async (req, res) => {
  const { optionIndex } = req.body;
  const poll = await Poll.findById(req.params.id);

  if (!poll) return res.status(404).json({ msg: "Poll not found" });
  if (poll.votedBy.includes(req.user.id)) return res.status(400).json({ msg: "Already voted" });

  poll.options[optionIndex].votes++;
  poll.votedBy.push(req.user.id);
  await poll.save();

  res.json({ poll });
});

// Edit poll
router.patch("/:id", auth, async (req, res) => {
  try {
    const { question, options } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ msg: "Poll not found" });

    if (poll.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    poll.question = question;
    poll.options = options.map(o => ({
      text: o.text,
      votes: o.votes || 0
    }));

    await poll.save();
    res.json({ poll });
  } catch (err) {
    console.error("PATCH /polls/:id error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});


// Delete poll
router.delete("/:id", auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: "Poll not found" });

    if (poll.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    await poll.deleteOne();
    res.json({ msg: "Poll deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
