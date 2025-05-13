import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

export default function PaginationLinks({ meta, onPageClick }) {
    function onClick(ev, link) {
        ev.preventDefault();
        if (!link.url) {
            return;
        }
        onPageClick(link);
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 mt-8 bg-white border border-gray-200 rounded-lg sm:px-6">
            <div className="flex justify-between flex-1 sm:hidden">
                <a
                    href="#"
                    onClick={(ev) => onClick(ev, meta.links[0])}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Previous
                </a>
                <a
                    href="#"
                    onClick={(ev) =>
                        onClick(ev, meta.links[meta.links.length - 1])
                    }
                    className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Next
                </a>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{meta.from}</span>{" "}
                        to <span className="font-medium">{meta.to}</span> of{" "}
                        <span className="font-medium">{meta.total}</span>{" "}
                        results
                    </p>
                </div>
                <div>
                    {meta.total > meta.per_page && (
                        <nav
                            aria-label="Pagination"
                            className="inline-flex space-x-1 rounded-md shadow-sm isolate"
                        >
                            {meta.links &&
                                meta.links.map((link, ind) => (
                                    <a
                                        href="#"
                                        onClick={(ev) => onClick(ev, link)}
                                        key={ind}
                                        aria-current="page"
                                        className={
                                            "relative z-10 inline-flex items-center py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 rounded-lg hover:opacity-90 m-1 " +
                                            (link.label.includes("Previous") ||
                                                link.label.includes("Next")
                                                ? "px-2 bg-gray-200 rounded-full"
                                                : "px-4 ") +
                                            (ind === 0 ? "rounded-l-md " : "") +
                                            (ind === meta.links.length - 1
                                                ? "rounded-r-md "
                                                : "") +
                                            (link.active
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-500 hover:bg-gray-100")
                                        }
                                    >
                                        {link.label.includes("Previous") && (
                                            <ChevronLeftIcon
                                                className="w-5 h-5"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {link.label.includes("Next") && (
                                            <ChevronRightIcon
                                                className="w-5 h-5"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {!link.label.includes("Previous") &&
                                            !link.label.includes("Next") && (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            )}
                                    </a>
                                ))}
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
}
