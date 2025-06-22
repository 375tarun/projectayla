
import userResourceModel from "../models/userResourceModel.js";

export async function getRewardHistory(req, res) {
  const { aylaId } = req.params;
  const page = parseInt(req.query.page) || 1;       // default to page 1
  const limit = parseInt(req.query.limit) || 10;    // default to 10 per page
  const skip = (page - 1) * limit;

  try {
    const [totalCount, history] = await Promise.all([
      userResourceModel.countDocuments({ aylaId }),
      userResourceModel.find({ aylaId })
        .sort({ acquiredAt: -1 }) // most recent first
        .skip(skip)
        .limit(limit)
        // .populate("resourceId", "name assetUrl assetType")
        .lean()
    ]);

    res.json({
      success: true,
      data: history,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: skip + history.length < totalCount,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}


export const getRewardFAQ = (req, res) => {
  const faqText = `
1. This page only contains the data of the last 6 months.

2. This page only records the following types of rewards, and other rewards are not displayed yet:
  a. Package gifts.
  b. Common virtual items, including: avatar frames, vehicles, diamond rings, themes, event titles, entrance shows, bubble boxes, CP Nest backgrounds, and profile card backgrounds.
  c. Coin rewards: including coins from event reward, weekly recharge reward, official reward, revenue rebates, and conversion coins of exceeding the revenue target.
  d. Recharge rebate card, elite number, wealth value, VIP.
  e. Part of the existing reward record page function reward distribution is not connected. You can directly go to the corresponding function record page to view.
`;

  res.json({
    success: true,
    type: "reward_faq",
    data: faqText.trim()
  });
};
