ifneq (,$(wildcard ./.env))
    include .env
    export
endif

run-agent:
	cd openai-agent && yarn agent

run-deploy-account:
	cd kernel-workflow && yarn deploy-account

run-register-executor:
	cd kernel-workflow && yarn register-executor

run-agent-workflow:
	cd kernel-workflow && yarn agent-workflow