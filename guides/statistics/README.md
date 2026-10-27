# Restorable Project history

Complete Project; 16 tasks. [Live Project](https://github.com/users/fssrepository/projects/4) · [Canonical complete backup](https://github.com/fssrepository/myscoutee-roadmap/tree/master/guides/statistics/e-kozig).

EKO-16 now includes the [detailed Hungarian prototype guide](https://github.com/fssrepository/e-kozig/commit/30dbbcdfdd10834a7bd81769bdd782f8a69563a8). Its cumulative measurement is **8,097,985 tokens**, **0.247052 active / 0.240047 allocated h**, and **$4.61 estimated Standard API equivalent**. The new October 27 work alone contributed 6,572,942 measured tokens and 0.143152 active h. The October 1 estimate remains intact in `measurements.json`; `post_control_task_usage` records the new work, and `current_task_totals` gives the combined EKO-16 figure. The separate AIP-1 allocation retains 25.22 seconds of observed parallel activity.

The current 16-task Project total is **464,348,015 tokens**, **9.602113 allocated h**, and **$262.23 estimated API equivalent**. See [the reproducible October 27 measurement](https://github.com/fssrepository/myscoutee-roadmap/blob/master/guides/statistics/e-kozig/measure-eko16.py) and [method](METHOD.md).

`project.json` preserves full issue bodies, statuses, typed field values and views. `measurements.json` preserves model/token/cost/time components and assumptions. `commit-map.json` links original and task-prefixed commit IDs. CSV/JSON provide convenient presentation exports. Recorded root intervals are retained in compressed JSON for timing reconstruction; there are no private chat texts.

## Validate offline

Run from the repository root:

```bash
python3 guides/statistics/restore_project.py
```

This validates all SHA256SUMS files and snapshot structure without network access.

## Recreate a deleted Project

Set `GITHUB_PROJECT_TOKEN` in your local shell to a credential with Projects write access. Run the same command with `--apply`. The script creates a new Project and restores task associations, fields, values, statuses and visible-column views; existing issues and source commits are preserved. Local progress is saved for retries. Use a separate `--state` file to create another copy. A repository subset restores only the tasks in that subset; use the complete backup to restore the whole Project.

If issues were deleted too, set `GITHUB_REPOSITORY_TOKEN` to an issue-write credential and add `--recreate-missing-issues`. The tracker repository must exist. Recreated issues may receive new issue numbers; stable task IDs remain. Historical execution dates remain in fields, while GitHub creation/closure timestamps reflect restoration.

Repository associations are included in `project.json`. Set `GITHUB_REPOSITORY_TOKEN` (or a suitable `GITHUB_TOKEN`) during restoration to reconnect them automatically. Separate Project-write and repository credentials are supported. Comments, automations and permission grants are outside this reconstruction. Read [METHOD.md](METHOD.md) for estimates, unknown values and measurement boundaries. Git versions these files; no dated folder is needed.
