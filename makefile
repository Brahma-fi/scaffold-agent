ifneq (,$(wildcard ./.env))
    include .env
    export
endif


run-deploy-account:
	cd kernel-workflow && yarn deploy-account

run-register-executor:
	cd kernel-workflow && yarn register-executor

run-agent-workflow:
	cd kernel-workflow && yarn agent-workflow

run-mcp-server:
	cd mcp-server && npm run dev

build-mcp-server:
	cd mcp-server && npm run build

start-mcp-server:
	cd mcp-server && npm start