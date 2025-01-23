ifneq (,$(wildcard ./.env))
    include .env
    export
endif

run-agent:
	cd agent-server && yarn agent

run-server:
	cd agent-server && yarn server