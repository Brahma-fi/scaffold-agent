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

run-update-automation:
	cd kernel-workflow && yarn update-automation

run-cancel-automation:
	cd kernel-workflow && yarn cancel-automation