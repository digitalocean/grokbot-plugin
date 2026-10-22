"""Integration evals for digitalocean-connect."""

from __future__ import annotations

pytest = __import__("pytest")
pytest.importorskip("skill_tools")

from skill_tools.evals.eval import Eval
from skill_tools.evals.testing import integration_eval_marks

pytestmark = integration_eval_marks


def test_403_scope_guidance() -> None:
    evaluation = Eval(
        __file__,
        prompt=(
            "I tried db-cluster-list and got HTTP 403 permission denied on "
            "digitalocean-databases. How do I fix auth?"
        ),
    )
    eval_result = evaluation.run()

    judge_result = eval_result.judge(
        expected_output=(
            "Explains per-connector OAuth, connecting digitalocean-databases, and "
            "that grants are not shared across MCP servers."
        ),
        assertions=[
            "Mentions connecting or signing in to digitalocean-databases specifically",
            "States that OAuth grants are per connector or not shared across endpoints",
            "Does not instruct the user to paste a PAT into chat or commit a token to the repo",
            "Offers a read-only or reconnect step before retrying the database call",
        ],
    )

    judged = judge_result.result
    assert judged.error is None
    for assertion in judged.assertion_results:
        assert assertion.passed, assertion.evidence
