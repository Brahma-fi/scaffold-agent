ifneq (,$(wildcard ./.env))
    include .env
    export
endif

run-agent:
	yarn agent

run-server:
	yarn server