import contactUs from "./contactUs.model";

// Service to create a new message
export const createMessage = async (messageData: {
  message: string;
  name: string;
  email: string;
  phone: string;
}) => {
  // Create a new message document
  const newMessage = new contactUs(messageData);

  // Save the message to the database
  return await newMessage.save();
};

export const getMessages = async (
  page: number,
  limit: number,
  date?: string,
  name?: string,
) => {
  const skip = (page - 1) * limit;
  const filter: any = { isDeleted: false };

  // Filter by date if provided
  if (date) {
    const [day, month, year] = date.split("-"); // Extract day, month, year
    const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`); // Start of the day
    const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999Z`); // End of the day
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay }; // Compare within the full day range
  }

  // Filter by name if provided
  if (name) {
    filter.name = { $regex: name, $options: "i" }; // Case-insensitive match
  }

  // Fetch messages from the database
  const messages = await contactUs
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Sort by most recent

  // Calculate the total number of messages and pages
  const totalMessages = await contactUs.countDocuments(filter);
  const totalPages = Math.ceil(totalMessages / limit);

  return { messages, totalMessages, totalPages };
};

export const getMessageById = async (id: string) => {
  return contactUs.findById(id);
};

export const messageDelete = async (id: string): Promise<void> => {
  await contactUs.findByIdAndUpdate(id, {
    isDeleted: true,
  });
};
