import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, FolderGit2, Lock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PaymentModal from "../components/PaymentModal";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { mediaUrl } from "../services/api";
import { downloadProject, fetchProjects } from "../services/projects";
import type { Project } from "../types";

export default function Projects() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payingProject, setPayingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });

  const handleDownload = async (project: Project) => {
    const path = await downloadProject(project.id);
    window.open(mediaUrl(path), "_blank");
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("projects.title")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <GlassCard key={p.id} className="flex flex-col !p-0 overflow-hidden">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
                {p.thumbnail ? (
                  <img src={mediaUrl(p.thumbnail)} className="h-full w-full object-cover" alt="" />
                ) : (
                  <FolderGit2 className="h-10 w-10 text-white/50" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-semibold">{localize(p.title_ar, p.title_en)}</h3>
                <p className="line-clamp-2 text-sm text-muted">{localize(p.description_ar, p.description_en)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tech_stack?.map((tech) => (
                    <span key={tech} className="badge !py-0.5 text-[10px]">{tech}</span>
                  ))}
                </div>
                {p.demo_url && (
                  <a href={p.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-nebula-cyan hover:underline">
                    <ExternalLink className="h-3 w-3" /> {t("projects.demo")}
                  </a>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="badge">${p.price}</span>
                  {!user ? (
                    <Button variant="secondary" disabled>
                      <Lock className="h-4 w-4" /> {t("nav.login")}
                    </Button>
                  ) : p.is_purchased ? (
                    <Button onClick={() => handleDownload(p)}>
                      <Download className="h-4 w-4" /> {t("common.download")}
                    </Button>
                  ) : (
                    <Button onClick={() => setPayingProject(p)}>{t("common.buyNow")}</Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {payingProject && (
        <PaymentModal
          type="project"
          refId={payingProject.id}
          onClose={() => setPayingProject(null)}
          onSuccess={() => {
            setPayingProject(null);
            qc.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}
    </div>
  );
}
