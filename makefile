ifneq (,$(wildcard ./.env))
    include .env
    export
endif

run-agent:
	cd agent-server && yarn agent

run-server:
	cd agent-server && yarn server

run-deploy-account:
	cd kernel-workflow && yarn deploy-account

run-register-executor:
	cd kernel-workflow && yarn register-executor