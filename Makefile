.PHONY: start
start:
	npm start

.PHONY: build
build:
	npm run build

.PHONY: lint
lint:
	npm run lint

.PHONY: ci
ci:
	npm run typecheck
	npm run lint
	npm run format:check
	npm run test
