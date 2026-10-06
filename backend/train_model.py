"""Train Verity's text classifier from a labeled CSV or JSONL dataset.

Expected fields:
  text: article/headline text
  label: fake/real, 0/1, or equivalent labels

Example:
  python train_model.py --data data/news.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


def load_rows(path: Path) -> tuple[list[str], list[int]]:
    texts: list[str] = []
    labels: list[int] = []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        if path.suffix.lower() == ".jsonl":
            rows = (json.loads(line) for line in file if line.strip())
        elif path.suffix.lower() == ".json":
            rows = json.load(file)
        else:
            rows = csv.DictReader(file)
        for row in rows:
            text = str(row.get("text", row.get("content", row.get("article", "")))).strip()
            raw_label = str(row.get("label", row.get("class", row.get("target", "")))).strip().lower()
            if not text or not raw_label:
                continue
            if raw_label in {"fake", "false", "misleading", "1", "fabricated"}:
                label = 1
            elif raw_label in {"real", "true", "credible", "0", "genuine"}:
                label = 0
            else:
                continue
            texts.append(text)
            labels.append(label)
    if len(set(labels)) < 2:
        raise ValueError("Dataset must contain both real and fake labels")
    return texts, labels


def main() -> int:
    parser = argparse.ArgumentParser(description="Train Verity's real/fake text classifier")
    parser.add_argument("--data", required=True, type=Path, help="CSV, JSON, or JSONL labeled dataset")
    parser.add_argument("--output", type=Path, default=Path("models/verity_text_model.joblib"))
    args = parser.parse_args()

    try:
        from joblib import dump
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
    except ImportError:
        print("Install backend requirements first: pip install -r requirements.txt", file=sys.stderr)
        return 2

    texts, labels = load_rows(args.data)
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.98,
        sublinear_tf=True,
        max_features=300000,
    )
    classifier = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    pipeline = Pipeline([("vectorizer", vectorizer), ("classifier", classifier)])
    pipeline.fit(train_texts, train_labels)
    predictions = pipeline.predict(test_texts)
    probabilities = pipeline.predict_proba(test_texts)
    fake_index = list(pipeline.classes_).index(1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    dump({
        "vectorizer": pipeline.named_steps["vectorizer"],
        "classifier": pipeline.named_steps["classifier"],
        "version": "tfidf-logreg-v1",
        "metrics": {
            "samples": len(texts),
            "accuracy": round(accuracy_score(test_labels, predictions), 4),
            "precision": round(precision_score(test_labels, predictions, zero_division=0), 4),
            "recall": round(recall_score(test_labels, predictions, zero_division=0), 4),
            "f1": round(f1_score(test_labels, predictions, zero_division=0), 4),
        },
    }, args.output)
    print(json.dumps({
        "output": str(args.output),
        "metrics": {
            "samples": len(texts),
            "accuracy": round(accuracy_score(test_labels, predictions), 4),
            "precision": round(precision_score(test_labels, predictions, zero_division=0), 4),
            "recall": round(recall_score(test_labels, predictions, zero_division=0), 4),
            "f1": round(f1_score(test_labels, predictions, zero_division=0), 4),
        },
        "classificationReport": classification_report(test_labels, predictions, zero_division=0),
        "fakeProbabilityPreview": [round(float(row[fake_index]), 4) for row in probabilities[:5]],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())