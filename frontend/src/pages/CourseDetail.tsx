import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Globe2, Lock, Play, ShoppingCart, Signal, Star, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../contexts/LanguageContext";
import { apiErrorMessage } from "../services/api";
import { fetchCourse, fetchReviews, submitReview } from "../services/courses";
import { enroll } from "../services/enrollments";
import * as paymentsApi from "../services/payments";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchReviews(id!),
    enabled: !!id,
  });

  if (isLoading || !course) {
    return <p className="text-center text-muted">{t("common.loading")}</p>;
  }

  const handleEnrollFree = async () => {
    setError("");
    try {
      await enroll(course.id);
      qc.invalidateQueries({ queryKey: ["course", id] });
      navigate(`/course/${course.id}/learn`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handlePaymentSuccess = async (result: any) => {
    try {
      await enroll(course.id, result.id);
      setShowPayment(false);
      qc.invalidateQueries({ queryKey: ["course", id] });
      navigate(`/course/${course.id}/learn`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleAddToCart = async () => {
    await paymentsApi.addToCart("course", course.id);
    refreshCart();
  };

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          {course.category && <span className="badge mb-3">{localize(course.category.name_ar, course.category.name_en)}</span>}
          <h1 className="text-3xl font-bold">{localize(course.title_ar, course.title_en)}</h1>
          <p className="mt-3 text-muted">{localize(course.description_ar, course.description_en)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{course.rating_avg?.toFixed(1)} ({course.rating_count})</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.student_count} {t("common.students")}</span>
            <span className="flex items-center gap-1"><Signal className="h-4 w-4" />{t(`common.${course.level}`)}</span>
            <span className="flex items-center gap-1"><Globe2 className="h-4 w-4" />{course.language === "ar" ? "العربية" : "English"}</span>
          </div>
          {course.instructor && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-xs font-bold text-white">
                {course.instructor.name.charAt(0)}
              </span>
              <span>{t("courses.instructor")}: {course.instructor.name}</span>
            </div>
          )}
        </div>

        <GlassCard>
          <h2 className="mb-4 text-lg font-bold">{t("courses.curriculum")}</h2>
          <div className="space-y-4">
            {course.modules.map((m) => (
              <div key={m.id}>
                <h3 className="mb-2 font-medium text-nebula-violet">{localize(m.title_ar, m.title_en)}</h3>
                <div className="space-y-1.5">
                  {m.lessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {l.locked ? <Lock className="h-4 w-4 text-muted" /> : <Play className="h-4 w-4 text-nebula-cyan" />}
                        {localize(l.title_ar, l.title_en)}
                      </span>
                      {l.is_preview && <span className="badge !py-0.5 text-[10px]">{t("courses.preview")}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {course.has_exam && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
              <BookOpen className="h-4 w-4 text-nebula-pink" />
              {t("courses.finalExam")}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-lg font-bold">{t("courses.reviews")} ({reviews.length})</h2>
          {user && course.is_enrolled && (
            <div className="mb-5 space-y-2 border-b border-white/10 pb-5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)}>
                    <Star className={`h-5 w-5 ${n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="input-glass resize-none"
                rows={2}
                placeholder={t("courses.writeReview") as string}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  await submitReview(course.id, reviewRating, reviewComment);
                  setReviewComment("");
                  qc.invalidateQueries({ queryKey: ["reviews", id] });
                }}
              >
                {t("courses.writeReview")}
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {r.user?.name?.charAt(0)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.user?.name}</span>
                    <span className="flex">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div>
        <GlassCard strong className="sticky top-24">
          <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30" />
          <div className="mb-4 text-3xl font-bold">
            {course.is_free ? t("common.free") : `$${course.price}`}
          </div>
          <p className="mb-4 text-sm text-muted">{totalLessons} {t("common.lessons")}</p>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          {!user ? (
            <Link to="/login">
              <Button className="w-full">{t("nav.login")}</Button>
            </Link>
          ) : course.is_enrolled ? (
            <Link to={`/course/${course.id}/learn`}>
              <Button className="w-full">{t("courses.continueLearning")}</Button>
            </Link>
          ) : course.is_free ? (
            <Button className="w-full" onClick={handleEnrollFree}>
              {t("courses.enroll")}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => setShowPayment(true)}>
                {t("common.buyNow")}
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
                {t("common.addToCart")}
              </Button>
            </div>
          )}
        </GlassCard>
      </div>

      {showPayment && (
        <PaymentModal
          type="course"
          refId={course.id}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
