package andrey.tomcattree.repository;

import andrey.tomcattree.model.Document;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends CrudRepository<Document, Long>{

    default List<Document> findRoots() {
        return findChildrenByParent(0L);
    }

    List<Document> findChildrenByParent(Long parent);
}
