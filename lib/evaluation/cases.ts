import type { CitationVerdict } from "../schemas/verdict";

export type CaseKind =
  | "retracted-source"
  | "fabricated-source"
  | "genuine-citation"
  | "mismatched-claim";

export interface EvaluationCase {
  identifier: string;
  kind: CaseKind;
  claimText: string;
  rawReference: string;
  acceptableVerdicts: CitationVerdict[];
  groundTruth: string;
}

export const evaluationCases: EvaluationCase[] = [
  {
    identifier: "retracted-wakefield",
    kind: "retracted-source",
    claimText:
      "Measles, mumps and rubella vaccination is associated with the onset of behavioural symptoms in children.",
    rawReference:
      "Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia, non-specific colitis, and pervasive developmental disorder in children. The Lancet. 1998. doi:10.1016/S0140-6736(97)11096-0",
    acceptableVerdicts: ["retracted"],
    groundTruth:
      "Retracted by The Lancet in 2010. OpenAlex records is_retracted true.",
  },
  {
    identifier: "retracted-lancet-surgisphere",
    kind: "retracted-source",
    claimText:
      "Hydroxychloroquine use in hospitalised COVID-19 patients was associated with increased mortality.",
    rawReference:
      "Mehra MR, et al. Hydroxychloroquine or chloroquine with or without a macrolide for treatment of COVID-19. The Lancet. 2020. doi:10.1016/S0140-6736(20)31180-6",
    acceptableVerdicts: ["retracted"],
    groundTruth:
      "Retracted 2020-05-22. Recorded by both Crossref and OpenAlex.",
  },
  {
    identifier: "retracted-nejm-surgisphere",
    kind: "retracted-source",
    claimText:
      "Cardiovascular disease increases the risk of in-hospital death from COVID-19 independently of drug therapy.",
    rawReference:
      "Mehra MR, et al. Cardiovascular disease, drug therapy, and mortality in COVID-19. New England Journal of Medicine. 2020. doi:10.1056/NEJMoa2007621",
    acceptableVerdicts: ["retracted"],
    groundTruth:
      "Retracted in 2020. Crossref does not record it; OpenAlex does.",
  },
  {
    identifier: "fabricated-doi-one",
    kind: "fabricated-source",
    claimText:
      "Transformer models reduce translation error by 63% compared with recurrent baselines.",
    rawReference:
      "Nakamura T, Villanueva R. Transformer efficiency in low-resource translation. Journal of Computational Linguistics. 2021. doi:10.4823/jcl.2021.99417",
    acceptableVerdicts: ["source-not-found", "could-not-check"],
    groundTruth: "This DOI does not resolve in Crossref or OpenAlex.",
  },
  {
    identifier: "fabricated-doi-two",
    kind: "fabricated-source",
    claimText:
      "Daily supplementation reduced cognitive decline by 22% over eighteen months.",
    rawReference:
      "Okonkwo A, Halvorsen B. Micronutrient supplementation and cognitive trajectory. Annals of Preventive Neurology. 2019. doi:10.5561/apn.2019.44812",
    acceptableVerdicts: ["source-not-found", "could-not-check"],
    groundTruth: "Invented journal and DOI. Neither registry holds it.",
  },
  {
    identifier: "genuine-attention",
    kind: "genuine-citation",
    claimText:
      "The Transformer architecture relies entirely on attention mechanisms, dispensing with recurrence and convolutions.",
    rawReference:
      "Vaswani A, et al. Attention Is All You Need. Advances in Neural Information Processing Systems. 2017. doi:10.48550/arXiv.1706.03762",
    acceptableVerdicts: ["supported", "partly-supported"],
    groundTruth:
      "This is the paper's own central claim, stated in its abstract.",
  },
  {
    identifier: "genuine-resnet",
    kind: "genuine-citation",
    claimText:
      "Residual learning frameworks make it easier to train substantially deeper networks.",
    rawReference:
      "He K, et al. Deep Residual Learning for Image Recognition. CVPR. 2016. doi:10.1109/CVPR.2016.90",
    acceptableVerdicts: ["supported", "partly-supported"],
    groundTruth: "Stated directly in the ResNet abstract.",
  },
  {
    identifier: "genuine-bert",
    kind: "genuine-citation",
    claimText:
      "Bidirectional pre-training of transformers improves performance across a range of language understanding tasks.",
    rawReference:
      "Devlin J, et al. BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. NAACL. 2019. doi:10.18653/v1/N19-1423",
    acceptableVerdicts: ["supported", "partly-supported"],
    groundTruth: "Stated directly in the BERT abstract.",
  },
  {
    identifier: "mismatch-resnet-claim",
    kind: "mismatched-claim",
    claimText:
      "Attention mechanisms allow models to be trained without any convolutional layers.",
    rawReference:
      "He K, et al. Deep Residual Learning for Image Recognition. CVPR. 2016. doi:10.1109/CVPR.2016.90",
    acceptableVerdicts: ["not-supported", "wrong-source", "could-not-check"],
    groundTruth:
      "ResNet is a convolutional architecture and says nothing about attention. The claim belongs to a different paper.",
  },
  {
    identifier: "mismatch-bert-number",
    kind: "mismatched-claim",
    claimText:
      "The model achieved a BLEU score of 41.8 on English-to-French translation.",
    rawReference:
      "Devlin J, et al. BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. NAACL. 2019. doi:10.18653/v1/N19-1423",
    acceptableVerdicts: ["not-supported", "wrong-source", "could-not-check"],
    groundTruth:
      "41.8 BLEU is from the Transformer paper. BERT reports no translation BLEU.",
  },
  {
    identifier: "mismatch-attention-medical",
    kind: "mismatched-claim",
    claimText:
      "Treatment reduced tumour volume by 43% in a randomised controlled trial.",
    rawReference:
      "Vaswani A, et al. Attention Is All You Need. NeurIPS. 2017. doi:10.48550/arXiv.1706.03762",
    acceptableVerdicts: ["not-supported", "wrong-source", "could-not-check"],
    groundTruth:
      "A machine learning paper cannot support a clinical trial finding.",
  },
  {
    identifier: "genuine-adam",
    kind: "genuine-citation",
    claimText:
      "Adam is an algorithm for first-order gradient-based optimisation based on adaptive estimates of lower-order moments.",
    rawReference:
      "Kingma DP, Ba J. Adam: A Method for Stochastic Optimization. ICLR. 2015. doi:10.48550/arXiv.1412.6980",
    acceptableVerdicts: ["supported", "partly-supported"],
    groundTruth: "This is the opening sentence of the Adam abstract.",
  },
];

export const caseKindLabels: Record<CaseKind, string> = {
  "retracted-source": "Retracted source",
  "fabricated-source": "Fabricated source",
  "genuine-citation": "Genuine citation",
  "mismatched-claim": "Claim from another paper",
};
