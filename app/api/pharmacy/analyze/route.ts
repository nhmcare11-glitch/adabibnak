import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File;

  if (!file) return NextResponse.json({ error: "no image" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
              },
            },
            {
              type: "text",
              text: `This is a medical prescription image. Extract only the medicine/drug names.
Reply with JSON only, no extra text:
{"drugs": ["drug1", "drug2"]}`,
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  console.log("Groq response:", JSON.stringify(data));

  const text = data.choices?.[0]?.message?.content || '{"drugs":[]}';

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ drugs: [] });
  }
}