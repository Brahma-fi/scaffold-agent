import { tool } from "@langchain/core/tools";
import { z } from "zod";

const adderSchema = z.object({
  a: z.number(),
  b: z.number()
});

const adderTool = tool(
  async (input): Promise<string> => {
    const sum = input.a + input.b;
    return `The sum of ${input.a} and ${input.b} is ${sum}`;
  },
  {
    name: "adder",
    description: "Adds two numbers together",
    schema: adderSchema
  }
);

export default adderTool;
