Based on the YouTube video about structured vibe coding, there are several key prompts you should use in specific scenarios throughout the development process.

Here's a breakdown of the prompts and when to use them:

- **Prompt for the Spec Interview (Iterative Questioning):**

    - **Scenario:** After doing initial research and having a general idea of your app's intent, job to be done, and target user, you use this prompt to engage in a back-and-forth conversation with an AI model that reasons well and responds quickly (like `gpt-3.5-turbo-16k` or the model referred to as "03 high mini").
    - **Purpose:** To collaboratively refine and expand upon your initial ideas for the product by having the AI ask you clarifying questions one at a time, building upon your previous answers. This iterative process helps to uncover requirements and considerations you might have initially overlooked.

    - **Boilerplate Prompt (as described in the video referencing Harper's blog):** "I want you to ask me one question at a time and ensure that every question that I answer you build on the previous answer for your next question so my answer should inform what that next question should be and then also remember only one question at a time".

- **Prompt for Generating the Developer-Ready Specification:**

    - **Scenario:** Once you've gone through the spec interview and the AI concludes that a solid outline has been established, you use this prompt with the same AI model.
    - **Purpose:** To consolidate all the information gathered during the interview into a structured, developer-ready specification document. This spec includes important details based on your discussion, such as key feature requirements, architecture, tech stack, data model, error handling, testing plans, and deployment considerations.

    - **Boilerplate Prompt (as described in the video referencing Harper's blog):** "Okay now that we've wrapped up what we've done with the brainstorming I want you now to create a developer ready specification that includes all the different types that are important uh things that are important based off of what we discussed above".
    
- **Prompt for Generating the Blueprint (Step-by-Step Plan):**

    - **Scenario:** After you have a comprehensive spec, you use this prompt with a "smarter model" like `gpt-4` or `01 pro`. You provide the entire specification to this model along with the blueprint generation prompt.
    - **Purpose:** To create a detailed, step-by-step plan for building the project. This blueprint breaks the development down into small, iterative chunks that build upon each other. It also emphasizes test-driven development (TDD), where each step starts with writing a test before building the functionality. The AI might go through multiple rounds of refining these chunks into even smaller, more detailed steps.

    - **Boilerplate Prompt (one variation used in the video referencing Harper's blog for greenfield projects):** "Okay I want a step-by-step blueprint building this project and this is really the most interesting part here and he kind of regurgitates this multiple times in the boilerplate but what we're doing here is we're saying okay I want you to build a solid plan i want you to break it down into small iterative chunks that build on each other so we're going to build things that are small enough to make meaningful progress in the project but not too big to overwhelm the AI but here's the next thing interesting thing is he says 'Okay once you've built these chunks I want you to actually go another round and review those chunks again making them into more smaller detailed steps.'".
    
- **Prompt for Generating Code Generation Prompts:**

    - **Scenario:** Once the AI has generated the detailed blueprint with iterative chunks, it will then create specific code generation prompts for each of those steps.
    - **Purpose:** To provide focused instructions to the AI (presumably used with a code editor like Cursor) for building out each individual chunk of the project as defined in the blueprint. Each prompt (Prompt A, Prompt B, etc.) corresponds to a specific chunk (Chunk A, Chunk B, etc.).

- **Prompt for Generating the To-Do List:**
    - **Scenario:** After the blueprint and associated code generation prompts are created, you use one final boilerplate prompt to generate the to-do list.
    - **Purpose:** To create a roadmap in Markdown format that outlines all the development chunks from the blueprint. This to-do list serves as a "macro" perspective to keep the AI focused on the overall goal as it works on the "micro" details of the code. The AI can check off completed tasks on this list, helping to maintain context across fresh conversations and smaller context windows.
    - **Format:** The to-do list is requested in Markdown to allow for easy tracking of completed tasks.

In summary, the structured vibe coding approach utilizes specific prompts at different stages to guide the AI in generating the spec through an interview process, creating a detailed blueprint for development, providing targeted code generation instructions, and establishing a roadmap for tracking progress. These prompts help to introduce structure and planning into a potentially more intuitive development style.