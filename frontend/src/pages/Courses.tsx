import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CourseCard from "../components/CourseCard";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchCategories, fetchCourses } from "../services/courses";

export default function Courses() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("");
  const [isFree, setIsFree] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const query = useMemo(
    () => ({
      search: search || undefined,
      category_id: categoryId || undefined,
      level: level || undefined,
      is_free: isFree || undefined,
      sort,
      page,
      page_size: 9,
    }),
    [search, categoryId, level, isFree, sort, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["courses", query],
    queryFn: () => fetchCourses(query as any),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("courses.title")}</h1>

      <div className="mb-8 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input-glass !ps-9"
            placeholder={t("common.search") as string}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-glass w-auto"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("courses.category")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {localize(c.name_ar, c.name_en)}
            </option>
          ))}
        </select>
        <select
          className="input-glass w-auto"
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("courses.level")}</option>
          <option value="beginner">{t("common.beginner")}</option>
          <option value="intermediate">{t("common.intermediate")}</option>
          <option value="advanced">{t("common.advanced")}</option>
        </select>
        <select
          className="input-glass w-auto"
          value={isFree}
          onChange={(e) => {
            setIsFree(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="">{t("common.all")}</option>
          <option value="true">{t("common.free")}</option>
          <option value="false">{t("courses.paidCourses")}</option>
        </select>
        <select className="input-glass w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">{t("courses.newest")}</option>
          <option value="rating">{t("courses.topRated")}</option>
          <option value="price_asc">{t("courses.priceLowHigh")}</option>
          <option value="price_desc">{t("courses.priceHighLow")}</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : data && data.results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-lg text-sm ${p === page ? "btn-primary !px-0 !py-0" : "btn-ghost"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted">{t("common.noResults")}</p>
      )}
    </div>
  );
}
