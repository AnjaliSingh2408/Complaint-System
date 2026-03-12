import axios from "axios"

export const classifyComplaint = async (title, description) => {

  const response = await axios.post(
    process.env.AI_SERVICE_URL,
    { title, description },
    { timeout: 10000 }
  )

  return response.data
}