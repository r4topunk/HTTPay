# ToolPay Implementation Notes Index

This file serves as an index and guide to the implementation notes for the ToolPay MVP. Each phase and chunk of the project has its own dedicated notes file, making it easy to navigate and maintain detailed documentation as the project evolves.

## Notes File Structure

- **phase1-chunk1.md**: Project setup and initial structure (Phase 1, Chunk 1)
- **phase1-chunk2.md**: Registry contract implementation (Phase 1, Chunk 2)
- **phase1-chunk3.md**: Escrow contract implementation (Phase 1, Chunk 3)
- **phase1-chunk4.md**: Contract unit tests and test environment (Phase 1, Chunk 4)
- **phase1-chunk5.md**: CI & Localnet configuration (Phase 1, Chunk 5)
- **phase2-chunk1.md**: Provider SDK project setup and contract bindings (Phase 2, Chunk 1) – Phase 2 completed, see this file for details.
- **phase3-chunk1.md**: Core SDK Classes implementation (Phase 3, Chunk 1) – Phase 3 completed, see this file for details.
- **phase4-chunk1.md**: Utilities and Configuration implementation (Phase 4, Chunk 1) – Phase 4 completed, see this file for details.
- **deployment.md**: Build, deployment, and contract addresses for Neutron testnet
- **architecture.md**: High-level architecture and design summary

_All files are now located in the `notes/` folder._

## How to Use This Index
- Each file contains detailed notes for a specific phase/chunk or topic.
- Refer to the appropriate file for implementation details, decisions, and progress tracking.
- Update the relevant chunk file as you work on new features or fix issues.

## Pattern for Iterating and Creating New Notes

When a new phase or chunk begins, or when a topic grows too large:
1. Create a new file named `phaseX-chunkY.md` (or `TOPIC.md` for special topics).
2. Move the relevant notes from this index or other files into the new file.
3. Add a brief summary and link to the new file in this index.
4. Keep each file focused on a single phase, chunk, or topic for clarity.

_Example:_
- When starting Phase 2, Chunk 2, create `phase2-chunk2.md` and update this index.
- For a new topic like frontend integration, create `frontend.md` and add it here.

---

For detailed implementation history, see the individual notes files listed above.
