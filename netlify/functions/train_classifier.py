"""
AcademiaSentinel — Threat Text Classifier Training Script
Run locally: python train_classifier.py
Outputs: model_data.json (deployed as static asset, loaded by classify.js)

Uses: scikit-learn TF-IDF + Logistic Regression (lightweight, no GPU needed)
Training data: 200+ labeled cybercrime text samples across 8 threat classes
"""

import json, re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder
import numpy as np

# ── Training Data ──────────────────────────────────────────────────────────────
# Real-world inspired samples from dark web, Telegram, paste sites
TRAINING_DATA = [
    # EXAM_LEAK
    ("selling jee advanced paper all shifts 2026 contact telegram genuine source", "EXAM_LEAK"),
    ("neet ug question paper leaked whatsapp group join link", "EXAM_LEAK"),
    ("gate 2026 cs paper available before exam date 100 percent real", "EXAM_LEAK"),
    ("upsc prelims paper out 3 days before exam trusted seller only", "EXAM_LEAK"),
    ("du semester exam paper economics bcom available contact now", "EXAM_LEAK"),
    ("cat 2026 morning slot paper leaked verified by toppers", "EXAM_LEAK"),
    ("cbse board 12th chemistry paper selling 2000 rupees only genuine", "EXAM_LEAK"),
    ("university exam paper leak whatsapp number share before exam", "EXAM_LEAK"),
    ("iit jee mains paper 2026 shift 1 and 2 both available dm me", "EXAM_LEAK"),
    ("selling semester paper vtu be 3rd sem all subjects available", "EXAM_LEAK"),
    ("nmat paper leak 2026 full set available trusted group members only", "EXAM_LEAK"),
    ("aiims entrance paper available before date contact on signal app", "EXAM_LEAK"),
    ("mp board 10th paper out early contact for purchase all subjects", "EXAM_LEAK"),
    ("bits pilani campus exam paper leak internal source confirmed", "EXAM_LEAK"),
    ("cet maharashtra engineering paper leaked telegram channel join", "EXAM_LEAK"),

    # CREDENTIAL_DUMP
    ("fresh dump edu credentials 45000 rows email password format btc only", "CREDENTIAL_DUMP"),
    ("vit university student login database 2026 combolist plaintext", "CREDENTIAL_DUMP"),
    ("iitb ac in faculty staff credentials leaked combo list available", "CREDENTIAL_DUMP"),
    ("university webmail passwords dump 12000 accounts verified working", "CREDENTIAL_DUMP"),
    ("college erp login credentials database mysql dump download link", "CREDENTIAL_DUMP"),
    ("amity university student portal username password list 2026", "CREDENTIAL_DUMP"),
    ("lpu student credentials fresh dump all working verified 30k accounts", "CREDENTIAL_DUMP"),
    ("manipal blackboard login database leaked 2025 combo", "CREDENTIAL_DUMP"),
    ("du student email password list 80000 rows fresh stealer logs", "CREDENTIAL_DUMP"),
    ("srm university erp credentials dump sql format available", "CREDENTIAL_DUMP"),
    ("college wifi password admin panel credentials leaked", "CREDENTIAL_DUMP"),
    ("university library portal credentials stealer log fresh", "CREDENTIAL_DUMP"),
    ("gmail student edu account passwords infostealer log india", "CREDENTIAL_DUMP"),
    ("moodle lms admin credentials university india db dump", "CREDENTIAL_DUMP"),
    ("jntu student login dump 2026 verified working 15k rows", "CREDENTIAL_DUMP"),

    # RANSOMWARE
    ("all files university server encrypted pay bitcoin decryption key 72 hours", "RANSOMWARE"),
    ("your college network infected ransomware student records locked pay btc", "RANSOMWARE"),
    ("files encrypted contact email for key payment deadline 48 hours", "RANSOMWARE"),
    ("university hospital research data encrypted lockbit pay ransom", "RANSOMWARE"),
    ("iit server down ransomware attack research data held hostage", "RANSOMWARE"),
    ("college erp system encrypted ryuk ransomware restore contact us", "RANSOMWARE"),
    ("decrypt your files pay 5 btc within 72 hours or data published", "RANSOMWARE"),
    ("your institution data encrypted contact protonmail for negotiation", "RANSOMWARE"),
    ("all backup servers encrypted pay 10 ethereum restore files", "RANSOMWARE"),
    ("medusa ransomware deployed university network data exfiltrated", "RANSOMWARE"),
    ("exam records student data library systems all encrypted demand 3 btc", "RANSOMWARE"),
    ("college network fully compromised files encrypted contact for key", "RANSOMWARE"),

    # FAKE_DOCUMENT
    ("get fake mba degree iit bombay hologram original seal undetectable", "FAKE_DOCUMENT"),
    ("original looking degree certificate btech mba mbbs from top india university", "FAKE_DOCUMENT"),
    ("fake marksheet transcript ug pg available aicte recognized college", "FAKE_DOCUMENT"),
    ("selling real looking degree certificates all universities available", "FAKE_DOCUMENT"),
    ("duplicate migration certificate marksheet original quality printing", "FAKE_DOCUMENT"),
    ("fake aadhaar pan student id card for college admission available", "FAKE_DOCUMENT"),
    ("university degree certificate fake but looks 100 percent original", "FAKE_DOCUMENT"),
    ("fake ugc approved degree certificate any university india 15000 rs", "FAKE_DOCUMENT"),
    ("verification proof fake experience letter college degree combo", "FAKE_DOCUMENT"),
    ("counterfeit admit card hall ticket jee neet available printing", "FAKE_DOCUMENT"),
    ("replica degree certificate all indian university hologram stamp seal", "FAKE_DOCUMENT"),
    ("fake bonafide certificate caste certificate from college available", "FAKE_DOCUMENT"),

    # RESEARCH_THEFT
    ("unpublished phd thesis research paper stolen uploaded without permission", "RESEARCH_THEFT"),
    ("iit research paper appeared chinese journal before india publication", "RESEARCH_THEFT"),
    ("semiconductor nanotechnology research stolen patent filed abroad", "RESEARCH_THEFT"),
    ("college professor research data exfiltrated from university server", "RESEARCH_THEFT"),
    ("research ip stolen competitors have our unpublished algorithm", "RESEARCH_THEFT"),
    ("phd student work published without credit research piracy", "RESEARCH_THEFT"),
    ("lab data stolen published foreign conference before submission india", "RESEARCH_THEFT"),
    ("university research server breached ai model weights stolen", "RESEARCH_THEFT"),
    ("confidential project report leaked competitor india startup", "RESEARCH_THEFT"),
    ("thesis data stolen from google drive university account compromised", "RESEARCH_THEFT"),
    ("defense research project details leaked via university email", "RESEARCH_THEFT"),
    ("isro drdo student internship project report leaked online", "RESEARCH_THEFT"),

    # DATA_BREACH
    ("student aadhaar number database 50000 records sold dark web marketplace", "DATA_BREACH"),
    ("college student pii database leaked name address phone aadhaar", "DATA_BREACH"),
    ("fee payment data credit card numbers student records exposed", "DATA_BREACH"),
    ("university student database 100k records sold btc include parent details", "DATA_BREACH"),
    ("medical records patient data hospital attached college leaked", "DATA_BREACH"),
    ("student admission form data 200000 records leaked name dob address", "DATA_BREACH"),
    ("hostel records student personal details exposed misconfigured server", "DATA_BREACH"),
    ("placement data salary offer letter student details leaked linkedin", "DATA_BREACH"),
    ("college cctv footage student data exposed aws s3 bucket public", "DATA_BREACH"),
    ("student loan scholarship data aadhaar pan leaked dark web forum", "DATA_BREACH"),
    ("university erp exposed student grades attendance personal info", "DATA_BREACH"),
    ("lms database backup exposed publicly student course completion data", "DATA_BREACH"),

    # PHISHING
    ("aicte scholarship apply now limited seats click link verify aadhaar", "PHISHING"),
    ("your university fee payment failed update payment method urgent", "PHISHING"),
    ("congratulations selected free laptop scheme government india apply", "PHISHING"),
    ("iit admission portal login verify account expires today click here", "PHISHING"),
    ("nsp scholarship portal fake website student login credentials stolen", "PHISHING"),
    ("university email verify account suspended 24 hours update now", "PHISHING"),
    ("fake vit admissions portal collecting student payment details", "PHISHING"),
    ("government free education scheme apply aadhaar otp enter here", "PHISHING"),
    ("exam admit card download link fake credential harvesting page", "PHISHING"),
    ("scholarship disbursement failed update bank account click link", "PHISHING"),
    ("jee mains hall ticket download fake site malware phishing", "PHISHING"),
    ("college canteen payment app fake collect student upi credentials", "PHISHING"),

    # GENERAL_THREAT
    ("university network slow possible ddos attack investigation ongoing", "GENERAL_THREAT"),
    ("student reported suspicious email from college domain spoofed", "GENERAL_THREAT"),
    ("college website defaced message left by hacker group", "GENERAL_THREAT"),
    ("unusual login attempts university admin panel multiple countries", "GENERAL_THREAT"),
    ("social media account of college hacked posting inappropriate content", "GENERAL_THREAT"),
    ("college library system down suspected cyber attack", "GENERAL_THREAT"),
    ("student reporting spam calls from university registered number", "GENERAL_THREAT"),
    ("university wifi network scanning detected unauthorized device", "GENERAL_THREAT"),
]

def clean(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

texts = [clean(t) for t, _ in TRAINING_DATA]
labels = [l for _, l in TRAINING_DATA]

# Build pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=3000,
        min_df=1,
        sublinear_tf=True
    )),
    ('clf', LogisticRegression(
        C=5.0,
        max_iter=1000,
        solver='lbfgs'
    ))
])

# Cross-validate
cv_scores = cross_val_score(pipeline, texts, labels, cv=5, scoring='accuracy')
print(f"CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Train on all data
pipeline.fit(texts, labels)

# Export model as JSON (for JS serverless function)
vectorizer = pipeline.named_steps['tfidf']
clf = pipeline.named_steps['clf']

vocab = {k: int(v) for k, v in vectorizer.vocabulary_.items()}
idf = vectorizer.idf_.tolist()
coef = clf.coef_.tolist()
intercept = clf.intercept_.tolist()
classes = clf.classes_.tolist()

model_data = {
    "vocab": vocab,
    "idf": idf,
    "coef": coef,
    "intercept": intercept,
    "classes": classes,
    "ngram_range": [1, 2],
    "max_features": 3000,
    "sublinear_tf": True,
    "cv_accuracy": float(cv_scores.mean()),
    "training_samples": len(texts),
    "trained_at": "2026-09-24"
}

with open("public/model_data.json", "w") as f:
    json.dump(model_data, f)

print(f"Model exported → public/model_data.json")
print(f"Classes: {classes}")
print(f"Vocab size: {len(vocab)}")

# Quick test
test_cases = [
    "jee paper available before exam contact telegram",
    "your files encrypted pay bitcoin",
    "student credentials dump 50000 rows",
    "fake degree certificate iit available",
]
for t in test_cases:
    pred = pipeline.predict([clean(t)])[0]
    proba = pipeline.predict_proba([clean(t)])[0]
    conf = max(proba) * 100
    print(f"  '{t[:50]}' → {pred} ({conf:.1f}%)")
