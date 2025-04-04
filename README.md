# Scaffold Agent

A collection of example implementations showcasing how to build autonomous DeFi agents using Console Kit. This repository demonstrates integration patterns ranging from LLM-powered execution to automated DeFi workflows.

![kernel-setup](./images/overview.png)

## Purpose

This scaffold serves as a starting point for developers looking to build autonomous DeFi agents. Whether you're interested in LLM-powered automation or traditional programmatic workflows, these examples provide patterns for integrating Console Kit's capabilities into your applications.

## Overview

### Kernel Workflow

Example implementations of automated DeFi workflows using Console Kit's infrastructure. These examples demonstrates how to set up simple automation that transfers when balance is above certain threshold that user provides.

## Local setup

1. Install dependencies

```bash
cd kernel-workflow && yarn
```

2. Set up environment variables and fill all values

```bash
mv .env.example .env
```

## Running components

### Kernel Workflow

1. To register your executor on console & kernel -

   - Configure `ExecutorConfigConsole`, `ExecutorMetadata`, and `ExecutorConfigKernel` on [register-executor.ts](./kernel-workflow/src/register-executor.ts) as per your requirements
   - Run from root dir:

   ```
   make run-register-executor
   ```

   - Pick up `registryId` from the script's response and update `EXECUTOR_REGISTRY_ID` in your .env, for running the remaining scripts

2. To deploy a console account that is subscribed to the automation of the executor just registered -
   - Configure `AutomationSubscriptionParams` on [deploy-automation-account.ts](kernel-workflow/src/deploy-automation-account.ts) as per your requirements
   - Run from root dir:
   ```
   make run-deploy-account
   ```
3. To run your automation workflow -
   - Modify `pollTasksAndSubmit()` on [agent-workflow.ts](kernel-workflow/src/agent-workflow.ts) with your automation logic. Console Kit SDK comes pre-built with native actions & helpers to make this easier
   - Run from root dir:
   ```
   make run-agent-workflow
   ```
   This will poll for your executable tasks, and run your automation periodically

## Additional Agent Based Examples

- [ConsoleKit LangChain Agent](https://github.com/Brahma-fi/scaffold-agent/tree/ft-addLangchain)
- [ConsoleKit OpenAI Agent](https://github.com/Brahma-fi/scaffold-agent/tree/ft-addOpenAi)
- [ConsoleKit Eliza Plugin](https://github.com/Brahma-fi/scaffold-agent/tree/ft-addEliza)
- [ConsoleKit MCP Server](https://github.com/Brahma-fi/scaffold-agent/tree/ft-mcpserver)

## References

- [Console Kit Docs](https://github.com/Brahma-fi/console-kit/blob/ft-docs/docs/introduction.md)
- [Console Kit SDK](https://www.npmjs.com/package/brahma-console-kit)
- [Brahma Builder](https://github.com/Brahma-fi/brahma-builder)
- [Brahma Builders Telegram Group](https://t.me/+O5fFUPVBFvU3ZjY1) (Join to get Console your API credentials)
